'use client';

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function CustomDatePicker({
  date,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  className,
}: DatePickerProps) {
  // Componente personalizado para el botón del calendario
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        variant="outline"
        onClick={onClick}
        ref={ref}
        className={cn(
          "w-full justify-start text-left font-normal h-10",
          !value && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value || placeholder}
      </Button>
    )
  );
  
  CustomInput.displayName = 'CustomDatePickerInput';

  return (
    <DatePicker
      selected={date}
      onChange={(date: Date | null) => onDateChange(date || undefined)}
      locale={es}
      dateFormat="PPP"
      customInput={<CustomInput />}
      calendarClassName="bg-background border rounded-md shadow-md p-2"
      dayClassName={() => "hover:bg-muted rounded-md"}
      weekDayClassName={() => "text-center py-2 text-muted-foreground"}
      monthClassName={() => "font-medium"}
      fixedHeight
    />
  );
}
