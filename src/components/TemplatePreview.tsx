"use client";

import { useState } from "react";
import { X, Table2, LayoutGrid, Calendar, Filter, Search, Plus, ChevronDown, MoreHorizontal, Check } from "lucide-react";

interface TemplatePreviewProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    templateDescription?: string;
    databases?: DatabasePreview[];
}

interface DatabasePreview {
    name: string;
    icon: string;
    properties: PropertyPreview[];
    sampleData: Record<string, any>[];
}

interface PropertyPreview {
    name: string;
    type: "title" | "text" | "number" | "select" | "multi_select" | "date" | "checkbox" | "url" | "email" | "status";
    options?: { name: string; color: string }[];
}

// Sample data for demo
const SAMPLE_DATABASE: DatabasePreview = {
    name: "Tasks",
    icon: "📋",
    properties: [
        { name: "Task", type: "title" },
        {
            name: "Status", type: "select", options: [
                { name: "To Do", color: "gray" },
                { name: "In Progress", color: "blue" },
                { name: "Done", color: "green" }
            ]
        },
        {
            name: "Priority", type: "select", options: [
                { name: "Low", color: "gray" },
                { name: "Medium", color: "yellow" },
                { name: "High", color: "red" }
            ]
        },
        { name: "Due Date", type: "date" },
        { name: "Completed", type: "checkbox" }
    ],
    sampleData: [
        { Task: "Design homepage", Status: "Done", Priority: "High", "Due Date": "2024-01-15", Completed: true },
        { Task: "Write documentation", Status: "In Progress", Priority: "Medium", "Due Date": "2024-01-20", Completed: false },
        { Task: "Setup CI/CD", Status: "To Do", Priority: "High", "Due Date": "2024-01-25", Completed: false },
        { Task: "Code review", Status: "In Progress", Priority: "Low", "Due Date": "2024-01-18", Completed: false },
        { Task: "Deploy to production", Status: "To Do", Priority: "High", "Due Date": "2024-01-30", Completed: false },
    ]
};

const STATUS_COLORS: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

type ViewMode = "table" | "board" | "calendar";

export function TemplatePreview({
    isOpen,
    onClose,
    templateName,
    templateDescription,
    databases = [SAMPLE_DATABASE]
}: TemplatePreviewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    if (!isOpen) return null;

    const currentDb = databases[0] || SAMPLE_DATABASE;

    // Filter data based on search and status
    const filteredData = currentDb.sampleData.filter(row => {
        const matchesSearch = !searchQuery ||
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(searchQuery.toLowerCase())
            );
        const matchesStatus = !selectedStatus || row.Status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    // Group by status for board view
    const groupedByStatus = currentDb.properties
        .find(p => p.name === "Status")?.options?.map(option => ({
            ...option,
            items: filteredData.filter(row => row.Status === option.name)
        })) || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{currentDb.icon}</span>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {templateName}
                            </h2>
                            {templateDescription && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {templateDescription}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Switcher */}
                        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-2 rounded-md transition-colors ${viewMode === "table"
                                        ? "bg-white dark:bg-gray-600 shadow-sm"
                                        : "hover:bg-white/50 dark:hover:bg-gray-600/50"
                                    }`}
                                title="Table View"
                            >
                                <Table2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("board")}
                                className={`p-2 rounded-md transition-colors ${viewMode === "board"
                                        ? "bg-white dark:bg-gray-600 shadow-sm"
                                        : "hover:bg-white/50 dark:hover:bg-gray-600/50"
                                    }`}
                                title="Board View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`p-2 rounded-md transition-colors ${viewMode === "calendar"
                                        ? "bg-white dark:bg-gray-600 shadow-sm"
                                        : "hover:bg-white/50 dark:hover:bg-gray-600/50"
                                    }`}
                                title="Calendar View"
                            >
                                <Calendar className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-1 max-w-xs">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 w-full"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                            <ChevronDown className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="flex-1" />

                    {/* New Button */}
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        New
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {viewMode === "table" && (
                        <TableView
                            properties={currentDb.properties}
                            data={filteredData}
                        />
                    )}
                    {viewMode === "board" && (
                        <BoardView
                            columns={groupedByStatus}
                        />
                    )}
                    {viewMode === "calendar" && (
                        <CalendarView
                            data={filteredData}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ✨ This is a live preview • Get this template to start using it!
                    </p>
                </div>
            </div>
        </div>
    );
}

// Table View Component
function TableView({ properties, data }: { properties: PropertyPreview[], data: Record<string, any>[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        {properties.map((prop, i) => (
                            <th
                                key={i}
                                className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50"
                            >
                                {prop.name}
                            </th>
                        ))}
                        <th className="w-10" />
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr
                            key={i}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                            {properties.map((prop, j) => (
                                <td key={j} className="p-3">
                                    <CellValue type={prop.type} value={row[prop.name]} options={prop.options} />
                                </td>
                            ))}
                            <td className="p-3">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Cell Value Renderer
function CellValue({ type, value, options }: { type: string, value: any, options?: { name: string; color: string }[] }) {
    if (value === undefined || value === null) {
        return <span className="text-gray-300 dark:text-gray-600">-</span>;
    }

    switch (type) {
        case "title":
            return <span className="font-medium text-gray-900 dark:text-white">{value}</span>;
        case "select":
            const option = options?.find(o => o.name === value);
            return (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[option?.color || "gray"]}`}>
                    {value}
                </span>
            );
        case "date":
            return <span className="text-sm text-gray-600 dark:text-gray-400">{new Date(value).toLocaleDateString()}</span>;
        case "checkbox":
            return value ? (
                <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                </div>
            ) : (
                <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600" />
            );
        default:
            return <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>;
    }
}

// Board View Component
function BoardView({ columns }: { columns: { name: string; color: string; items: Record<string, any>[] }[] }) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
            {columns.map((column, i) => (
                <div
                    key={i}
                    className="flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3"
                >
                    {/* Column Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[column.color]}`}>
                            {column.name}
                        </span>
                        <span className="text-sm text-gray-400">{column.items.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                        {column.items.map((item, j) => (
                            <div
                                key={j}
                                className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                                    {item.Task}
                                </h4>
                                <div className="flex items-center gap-2 text-xs">
                                    {item.Priority && (
                                        <span className={`px-1.5 py-0.5 rounded ${item.Priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                item.Priority === "Medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                    "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                            }`}>
                                            {item.Priority}
                                        </span>
                                    )}
                                    {item["Due Date"] && (
                                        <span className="text-gray-400">
                                            {new Date(item["Due Date"]).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add Card Button */}
                        <button className="w-full p-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add card
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Calendar View Component  
function CalendarView({ data }: { data: Record<string, any>[] }) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);

    // Group tasks by date
    const tasksByDate: Record<number, typeof data> = {};
    data.forEach(item => {
        if (item["Due Date"]) {
            const date = new Date(item["Due Date"]);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                const day = date.getDate();
                if (!tasksByDate[day]) tasksByDate[day] = [];
                tasksByDate[day].push(item);
            }
        }
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <div>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h3>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map(day => {
                    const isToday = day === today.getDate();
                    const tasks = tasksByDate[day] || [];

                    return (
                        <div
                            key={day}
                            className={`
                aspect-square p-1 border rounded-lg transition-colors cursor-pointer
                ${isToday
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                }
              `}
                        >
                            <div className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                                }`}>
                                {day}
                            </div>
                            <div className="space-y-0.5">
                                {tasks.slice(0, 2).map((task, i) => (
                                    <div
                                        key={i}
                                        className="text-[10px] truncate px-1 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                    >
                                        {task.Task}
                                    </div>
                                ))}
                                {tasks.length > 2 && (
                                    <div className="text-[10px] text-gray-400">+{tasks.length - 2} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
