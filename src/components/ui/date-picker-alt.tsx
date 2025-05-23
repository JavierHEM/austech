'use client';

import React, { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import 'react-datepicker/dist/react-datepicker.css';

// Registrar el locale español
registerLocale('es', es);

interface DatePickerAltProps {
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePickerAlt({
  date,
  onDateChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  className,
}: DatePickerAltProps) {
  // Componente personalizado para el botón de selección
  const CustomInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        variant="outline"
        onClick={(e) => {
          // Evitar que el evento se propague y pueda causar un envío de formulario
          e.preventDefault();
          e.stopPropagation();
          if (onClick) onClick();
        }}
        type="button" // Asegurarse de que no sea un botón de tipo submit
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full justify-start text-left font-normal',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value || placeholder}
      </Button>
    )
  );
  
  CustomInput.displayName = 'DatePickerCustomInput';

  return (
    <DatePicker
      selected={date}
      onChange={onDateChange}
      locale="es"
      dateFormat="dd/MM/yyyy"
      customInput={<CustomInput />}
      disabled={disabled}
      calendarClassName="bg-background border rounded-md shadow-md p-2"
      dayClassName={() => "text-center"}
      weekDayClassName={() => "text-center"}
      monthClassName={() => "text-center"}
      popperClassName="z-50"
      popperPlacement="bottom-start"
      showPopperArrow={false}
      // Evitar que el calendario se cierre al hacer clic fuera
      shouldCloseOnSelect={true}
      // Prevenir que se envíe el formulario al seleccionar una fecha
      onFocus={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        // Evitar que la tecla Enter envíe el formulario
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      }}
    />
  );
}
