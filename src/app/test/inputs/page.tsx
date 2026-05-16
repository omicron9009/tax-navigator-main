import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Keyboard, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12 font-sans">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-2 text-slate-900">
          <Keyboard className="h-5 w-5 text-teal-600" />
          <h1 className="text-xl font-bold tracking-tight">Form Elements</h1>
        </div>

        {/* Main Card Container */}
        <Card className="p-8 shadow-sm border-slate-200/60 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* --- LEFT COLUMN --- */}
            <div className="space-y-8">
              <Input label="Standard Input" placeholder="Enter text..." />

              <Input
                label="Input with Icon"
                placeholder="Search records..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="space-y-8">
              {/* Select Dropdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-900">
                  Select Dropdown
                </Label>
                <Select>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option-1">Option 1</SelectItem>
                    <SelectItem value="option-2">Option 2</SelectItem>
                    <SelectItem value="option-3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-900">
                  Checkboxes
                </Label>

                <div className="flex flex-col gap-3 pt-1">
                  {/* Selected Checkbox */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="selected"
                      defaultChecked
                      className="h-5 w-5 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label
                      htmlFor="selected"
                      className="font-normal text-base text-slate-700 cursor-pointer"
                    >
                      Selected Option
                    </Label>
                  </div>

                  {/* Unselected Checkbox */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="unselected"
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    <Label
                      htmlFor="unselected"
                      className="font-normal text-base text-slate-700 cursor-pointer"
                    >
                      Unselected Option
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
