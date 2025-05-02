import { getRooms } from '@/lib/data';
import { RoomTableClient } from '@/components/admin/rooms/room-table-client'; // To be created
import { Button } from '@/components/ui/button';
import { AddRoomDialog } from '@/components/admin/rooms/add-room-dialog'; // To be created
import { DoorOpen } from 'lucide-react'; // Using DoorOpen icon for rooms

// Define a type for Room with the added _count relation from getRooms
import type { Room as PrismaRoom } from '@prisma/client';
type RoomWithBookingCount = PrismaRoom & {
  _count: {
    examRooms: number;
  };
};

export default async function RoomsPage() {
  // Fetch rooms data including the booking count
  const rooms: RoomWithBookingCount[] = await getRooms();

  return (
    <div className="space-y-6">
      {/* Remove the redundant header div from the page component */}
      {/* The RoomTableClient will render the correct header */}
      <RoomTableClient initialData={rooms} />
    </div>
  );
}