"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const features = [
  {
    value: "tableQA",
    label: "Table Question Answering",
  },
  {
    value: "chartQA",
    label: "Chart Question Answering",
  },
  {
    value: "docQA",
    label: "Document Analysis",
  },
  {
    value: "finAdvisor",
    label: "Financial Advisor",
  },
  {
    value: "marketAnalyst",
    label: "Market Analyst",
  },
  {
    value: "portfolioPlanner",
    label: "Portfolio Planner",
  },
]

interface ComboboxProps {
  onValueChange: (value: string) => void;
}

export function Combobox({ onValueChange }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  // Whenever value changes, call the onValueChange prop function
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange(newValue); // notify parent component of the value change
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? features.find((feature) => feature.value === value)?.label
            : "Select feature..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search feature..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {features.map((feature) => (
                <CommandItem
                  key={feature.value}
                  value={feature.value}
                  onSelect={(currentValue) => {
                    const newValue = currentValue === value ? "" : currentValue;
                    handleValueChange(newValue); // Use the new handleValueChange function
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === feature.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {feature.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
