import React from "react";
import { formatMessageDate } from "@/utils/dateUtils";

interface DateSeparatorProps {
  date: Date;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300">
        {formatMessageDate(date)}
      </div>
    </div>
  );
};

export default DateSeparator;
