import { CalendarPlus, UserPlus, Edit, Trash2, FilePenLine, UserCog } from "lucide-react"
import type { Activity } from "@/lib/data" // Import Activity type
import { formatDistanceToNow } from 'date-fns' // For relative time formatting

// Define props interface
interface RecentActivityProps {
  activities: Activity[];
}

// Map activity types to icons and descriptions
const activityConfig = {
  exam_added: { icon: CalendarPlus, text: "added exam" },
  exam_updated: { icon: FilePenLine, text: "updated exam" }, // Use FilePenLine for update
  exam_deleted: { icon: Trash2, text: "deleted exam" },
  invigilator_added: { icon: UserPlus, text: "added invigilator" },
  invigilator_updated: { icon: UserCog, text: "updated invigilator" }, // Use UserCog for update
  invigilator_deleted: { icon: Trash2, text: "deleted invigilator" },
};

export function RecentActivity({ activities }: RecentActivityProps) { // Accept activities prop
  return (
    <div className="space-y-8">
      {activities.length === 0 ? (
         <p className="text-sm text-muted-foreground text-center">No recent activity.</p>
      ) : (
        activities.map((activity) => {
          const config = activityConfig[activity.type] || { icon: Edit, text: "performed action" }; // Fallback
          const Icon = config.icon;
          const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

          return (
            <div key={activity.id} className="flex items-start">
              <div className="mr-4 mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {/* Use data from Activity type */}
                  {activity.user} {config.text}
                </p>
                {/* Display the description from the activity log */}
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
