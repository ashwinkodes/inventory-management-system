import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClub } from "@/contexts/ClubContext";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarRequest {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  user: { name: string };
  club: { name: string };
  items: { gear: { name: string; category: string } }[];
}

export default function CalendarView() {
  const { activeClub } = useClub();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: requests = [] } = useQuery({
    queryKey: ["calendar", activeClub?.id, format(currentMonth, "yyyy-MM")],
    queryFn: () => {
      const params = new URLSearchParams({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      });
      if (activeClub) params.set("clubId", activeClub.id);
      return api.get<CalendarRequest[]>(`/requests/calendar?${params}`);
    },
  });

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  function getRequestsForDay(day: Date) {
    return requests.filter((r) =>
      isWithinInterval(day, {
        start: new Date(r.startDate),
        end: new Date(r.endDate),
      })
    );
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rental Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dayRequests = getRequestsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r p-1 ${
                  !isCurrentMonth ? "bg-gray-50" : ""
                }`}
              >
                <div
                  className={`mb-1 text-right text-sm ${
                    isToday
                      ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white float-right"
                      : !isCurrentMonth
                        ? "text-gray-300"
                        : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5 clear-both">
                  {dayRequests.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      className={`rounded px-1 py-0.5 text-xs truncate ${
                        req.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                      title={`${req.user.name}: ${req.items.map((i) => i.gear.name).join(", ")}`}
                    >
                      {req.user.name}
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-100" />
          <span className="text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-100" />
          <span className="text-gray-600">Checked Out</span>
        </div>
      </div>
    </div>
  );
}
