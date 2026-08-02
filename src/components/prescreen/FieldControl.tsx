import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Answers, FieldDef } from './formDefinition';

/**
 * Renders one pre-screen question.
 *
 * `data-field-invalid` is what the form scrolls to when a step will not
 * advance — without it the Next button looks broken on a long step, because
 * the reason it did nothing is off-screen.
 */
export function FieldControl({
  field,
  answers,
  onChange,
  error,
}: {
  field: FieldDef;
  answers: Answers;
  onChange: (field: FieldDef, value: Answers[string]) => void;
  error: string | null;
}) {
  const value = answers[field.id];
  const stringValue = typeof value === 'string' ? value : '';
  const describedBy = error ? `${field.id}-error` : undefined;

  return (
    <div data-field-invalid={error ? 'true' : undefined}>
      <Label htmlFor={field.id} className="text-base font-semibold text-navy">
        {field.label}
        {field.required === false && (
          <span className="ml-2 text-xs font-normal text-navy-muted">
            (optional)
          </span>
        )}
      </Label>

      {field.hint && (
        <p className="mt-1 text-sm text-navy-muted">{field.hint}</p>
      )}

      <div className="mt-3">
        {field.type === 'radio' && (
          <RadioGroup
            value={stringValue}
            onValueChange={(v) => onChange(field, v)}
            className="space-y-2"
          >
            {(field.options ?? []).map((option) => (
              <label
                key={option}
                htmlFor={`${field.id}-${option}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 transition-colors hover:border-navy/25 has-[:checked]:border-gold has-[:checked]:bg-gold/5"
              >
                <RadioGroupItem
                  id={`${field.id}-${option}`}
                  value={option}
                  aria-describedby={describedBy}
                />
                <span className="text-sm text-navy">{option}</span>
              </label>
            ))}
          </RadioGroup>
        )}

        {field.type === 'select' && (
          <Select
            value={stringValue}
            onValueChange={(v) => onChange(field, v)}
          >
            <SelectTrigger id={field.id} aria-describedby={describedBy}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(field.type === 'text' ||
          field.type === 'email' ||
          field.type === 'tel' ||
          field.type === 'number') && (
          <Input
            id={field.id}
            type={
              field.type === 'number'
                ? 'number'
                : field.type === 'email'
                  ? 'email'
                  : field.type === 'tel'
                    ? 'tel'
                    : 'text'
            }
            // A numeric keypad on mobile for what is a number in all but name.
            inputMode={
              field.type === 'number'
                ? 'decimal'
                : field.type === 'tel'
                  ? 'tel'
                  : undefined
            }
            value={stringValue}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            min={field.min}
            max={field.max}
            step="any"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(field, e.target.value)}
          />
        )}
      </div>

      {error && (
        <p id={`${field.id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
