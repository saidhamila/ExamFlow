"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Search, ChevronLeft, ChevronRight, Download, Loader2, Trash2, Edit, DoorOpen } from "lucide-react" // Added DoorOpen

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AddRoomDialog } from "@/components/admin/rooms/add-room-dialog" // To be created
import { EditRoomDialog } from "@/components/admin/rooms/edit-room-dialog" // To be created
import { DeleteRoomDialog } from "@/components/admin/rooms/delete-room-dialog" // To be created
import { useToast } from "@/hooks/use-toast"
import type { Room as PrismaRoom } from "@prisma/client";
import { deleteRoomAction } from "@/lib/actions" // Import room action
import { cn } from "@/lib/utils" // Import cn for conditional classes

// Define the detailed Room type matching the data fetched in the page
type RoomWithBookingCount = PrismaRoom & {
  _count: {
    examRooms: number;
  };
};

// Define props
interface RoomTableClientProps {
  initialData: RoomWithBookingCount[];
}

export function RoomTableClient({ initialData }: RoomTableClientProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition(); // For delete action
  // State to hold specific deletion error message for a room
  const [deleteError, setDeleteError] = useState<{ roomId: string; message: string } | null>(null);

  // State for rooms
  const [rooms, setRooms] = useState<RoomWithBookingCount[]>(initialData)
  const [filteredRooms, setFilteredRooms] = useState<RoomWithBookingCount[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]) // Store room IDs

  // Update list when initial data changes
  useEffect(() => {
    setRooms(initialData);
    // Re-apply search filter
    if (searchTerm.trim() === "") {
      setFilteredRooms(initialData);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = initialData.filter(
        (room) =>
          room.roomName.toLowerCase().includes(term) ||
          room.location?.toLowerCase().includes(term) ||
          room.capacity.toString().includes(term) // Search capacity
      );
      setFilteredRooms(filtered);
    }
    setSelectedRoomIds([]); // Reset selection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Client-side search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    const lowerCaseTerm = term.toLowerCase();

    if (term.trim() === "") {
      setFilteredRooms(rooms); // Reset to full list
    } else {
      const filtered = rooms.filter(
        (room) =>
          room.roomName.toLowerCase().includes(lowerCaseTerm) ||
          room.location?.toLowerCase().includes(lowerCaseTerm) ||
          room.capacity.toString().includes(lowerCaseTerm)
      );
      setFilteredRooms(filtered);
    }
    setSelectedRoomIds([]); // Reset selection on search
  };

  // --- Delete Handler ---
  const handleDeleteRoom = (roomId: string) => {
    // Clear previous specific error before starting a new delete attempt
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteRoomAction(roomId); // Expects DeleteRoomActionResult

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
          variant: "default",
        });
        // Revalidation should update the list via initialData prop change
        setSelectedRoomIds(prev => prev.filter(id => id !== roomId));
      } else {
        // Handle specific assignment error
        if (result.errorType === 'assignments_exist' && result.details) {
           const friendlyMessage = `Cannot delete: Room assigned to ${result.details.examCount} exam(s) and ${result.details.invigilatorCount} invigilator assignment(s).`;
           setDeleteError({ roomId, message: friendlyMessage });
           // No toast here, error shown in dialog
        } else {
          // Handle other errors (not found, db error, invalid id) with a toast
          toast({
            title: "Error",
            description: result.message, // Use the message from the action result
            variant: "destructive",
          });
        }
      }
    });
  };

  // --- Selection Handlers ---
  const toggleSelectRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((selectedId) => selectedId !== roomId) : [...prev, roomId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRoomIds.length === filteredRooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(filteredRooms.map((room) => room.roomId));
    }
  };

  // --- Export Handler ---
  const exportToCSV = () => {
    const headers = ["RoomID", "RoomName", "Capacity", "Location", "IsAvailable", "BookingCount", "CreatedAt", "UpdatedAt"];
    const csvContent = [
      headers.join(","),
      ...filteredRooms.map((room) =>
        [
          room.roomId,
          `"${room.roomName}"`,
          room.capacity,
          `"${room.location ?? ''}"`,
          room.isAvailable,
          room._count.examRooms, // Use booking count
          room.createdAt.toISOString(),
          room.updatedAt.toISOString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "rooms_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: "Filtered rooms have been exported to CSV",
    });
  };

  return (
     <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col xs:flex-row items-center justify-between py-4 border-b sticky top-0 bg-background z-10 px-4 md:px-6">
          <h1 className="text-xl xs:text-2xl font-semibold mb-2 xs:mb-0">Room Management</h1>
          <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
            {/* Add Room Dialog Trigger */}
            <AddRoomDialog>
                <Button size="sm">
                    <DoorOpen className="h-4 w-4 mr-2" />
                    Add Room
                </Button>
            </AddRoomDialog>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <div className="relative w-full xs:w-auto mt-2 xs:mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search rooms..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <Card className="m-4 md:m-6 flex-grow">
          <CardContent className="p-0 h-full">
            <div className="overflow-x-auto h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          filteredRooms.length > 0 &&
                          selectedRoomIds.length === filteredRooms.length
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={filteredRooms.length === 0}
                      />
                    </TableHead>
                    <TableHead>Room Name</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Capacity</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Bookings</TableHead>
                    <TableHead className="hidden xs:table-cell text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => (
                      <TableRow key={room.roomId} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedRoomIds.includes(room.roomId)}
                            onCheckedChange={() => toggleSelectRoom(room.roomId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{room.roomName}</div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            {room.location ?? 'N/A'}
                          </div>
                           <div className="text-sm text-muted-foreground xs:hidden">
                             <Badge variant={room.isAvailable ? "success" : "secondary"} className="mt-1">
                               {room.isAvailable ? 'Available' : 'Unavailable'}
                             </Badge>
                           </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{room.location ?? 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{room.capacity}</TableCell>
                        <TableCell className="hidden sm:table-cell text-center">{room._count.examRooms}</TableCell>
                        <TableCell className="hidden xs:table-cell text-center">
                           <Badge variant={room.isAvailable ? "success" : "secondary"}>
                             {room.isAvailable ? 'Available' : 'Unavailable'}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Edit Room Dialog Trigger - Button is now internal */}
                            <EditRoomDialog room={room} />
                            {/* Delete Room Dialog Trigger */}
                            {/* Delete Room Dialog Trigger - Button is now internal */}
                            <DeleteRoomDialog
                                roomId={room.roomId}
                                roomName={room.roomName}
                                onDelete={() => handleDeleteRoom(room.roomId)}
                                isDeleting={isPending}
                                // Pass the specific error message if it's for this room
                                specificError={deleteError?.roomId === room.roomId ? deleteError.message : undefined}
                                // Add onOpenChange to clear error when dialog closes
                                onOpenChange={(open: boolean) => { // Add boolean type
                                    if (!open) {
                                        setDeleteError(null); // Clear error when dialog closes
                                    }
                                }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No rooms found matching your search." : "No rooms found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination (Placeholder - Needs implementation) */}
            <div className="flex flex-col xs:flex-row items-center justify-between p-4 border-t gap-4 xs:gap-2">
               <div className="flex items-center gap-2">
                 <Select defaultValue="10">
                   <SelectTrigger className="w-[70px]">
                     <SelectValue placeholder="10" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                     <SelectItem value="50">50</SelectItem>
                     <SelectItem value="100">100</SelectItem>
                   </SelectContent>
                 </Select>
                 <span className="text-sm text-muted-foreground">items per page</span>
               </div>
               <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" disabled>
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <span className="text-sm">Page 1 of 1</span> {/* Needs dynamic update */}
                 <Button variant="outline" size="icon" disabled>
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Footer (Placeholder) */}
        {selectedRoomIds.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 flex justify-between items-center shadow-md lg:left-64 z-20">
            <div className="text-sm">{selectedRoomIds.length} rooms selected</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Bulk Action 1
              </Button>
              <Button variant="destructive" size="sm" disabled>
                Bulk Delete
              </Button>
            </div>
          </div>
        )}
      </div>
  )
}