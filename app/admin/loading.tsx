import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // You can customize this skeleton further based on the admin dashboard layout
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-1/3" /> {/* Page Title Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" /> {/* Stat Card Skeleton */}
        <Skeleton className="h-24 w-full" /> {/* Stat Card Skeleton */}
        <Skeleton className="h-24 w-full" /> {/* Stat Card Skeleton */}
        <Skeleton className="h-24 w-full" /> {/* Stat Card Skeleton */}
      </div>
      <div className="border shadow-sm rounded-lg p-2">
        <Skeleton className="h-[300px] w-full" /> {/* Chart/Table Skeleton */}
      </div>
    </div>
  );
}