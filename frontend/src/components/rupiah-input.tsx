import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

const formatter = new Intl.NumberFormat('id-ID');

type RupiahInputProps<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;
    className?: string;
    placeholder?: string;
};

/**
 * Input harga dengan tampilan Rupiah ("15.000"), tapi nilai di form tetap number (15000).
 * Input kosong disimpan sebagai NaN supaya yup `.typeError()` memunculkan pesan "wajib diisi".
 */
const RupiahInput = <T extends FieldValues>({ control, name, className = '', placeholder = '0' }: RupiahInputProps<T>) => (
    <Controller
        control={control}
        name={name}
        render={({ field }) => {
            const value = field.value as number | undefined;
            const display = value === undefined || value === null || Number.isNaN(value) ? '' : formatter.format(value);

            return (
                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        Rp
                    </span>
                    <input
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={placeholder}
                        value={display}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            field.onChange(digits === '' ? NaN : Number(digits));
                        }}
                        className={`${className} pl-9 tabular-nums`}
                    />
                </div>
            );
        }}
    />
);

export default RupiahInput;
