import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex flex-col space-y-4 p-4 md:p-6">
      <Skeleton className="h-8 w-1/4" /> {/* Title Skeleton */}
      <div className="border shadow-sm rounded-lg p-2">
        <Skeleton className="h-[400px] w-full" /> {/* Table/Content Skeleton */}
      </div>
    </div>
  );
}
