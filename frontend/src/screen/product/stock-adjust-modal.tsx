import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Modal from '../../components/modal';
import { createStockMovement, type Product } from '../../services/products';

type StockAdjustModalProps = {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
};

const buildSchema = (currentStock: number) =>
    yup.object({
        type: yup.mixed<'in' | 'out'>().oneOf(['in', 'out']).required(),
        qty: yup
            .number()
            .typeError('Jumlah wajib diisi')
            .integer('Jumlah harus bilangan bulat')
            .min(1, 'Jumlah minimal 1')
            .required('Jumlah wajib diisi')
            .when('type', {
                is: 'out',
                then: (s) => s.max(currentStock, `Stok tidak cukup (tersedia ${currentStock})`),
            }),
        note: yup.string().trim().max(255, 'Catatan maksimal 255 karakter').default(''),
    });

type FormValues = yup.InferType<ReturnType<typeof buildSchema>>;

const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900';

const typeOptions = [
    { value: 'in', label: 'Masuk', icon: ArrowDownToLine, active: 'border-green-600 bg-green-50 text-green-700' },
    { value: 'out', label: 'Keluar', icon: ArrowUpFromLine, active: 'border-red-600 bg-red-50 text-red-700' },
] as const;

const StockAdjustModal = ({ product, isOpen, onClose, onSuccess, onError }: StockAdjustModalProps) => {
    const currentStock = product?.stock ?? 0;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: yupResolver(buildSchema(currentStock)),
        defaultValues: { type: 'in', qty: undefined, note: '' },
    });

    // Kosongkan form setiap kali modal dibuka untuk produk lain
    useEffect(() => {
        if (isOpen) reset({ type: 'in', qty: undefined, note: '' });
    }, [isOpen, product?.id, reset]);

    const type = watch('type');
    const qty = watch('qty');
    const validQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const stockAfter = type === 'in' ? currentStock + validQty : currentStock - validQty;

    const onSubmit = async (values: FormValues) => {
        if (!product) return;
        try {
            await createStockMovement(product.id, {
                type: values.type,
                qty: values.qty,
                note: values.note || undefined,
            });
            onSuccess(
                `Stok "${product.name}" ${values.type === 'in' ? 'bertambah' : 'berkurang'} ${values.qty}`,
            );
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message ?? 'Gagal mengubah stok'
                : 'Gagal mengubah stok';
            onError(message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Atur Stok</h3>
                    <p className="text-sm text-gray-500">
                        {product?.name} <span className="font-mono text-xs">({product?.sku})</span>
                    </p>
                </div>

                <fieldset disabled={isSubmitting} className="space-y-4">
                    <div className="space-y-1">
                        <span className="block text-sm font-medium text-gray-700">Tipe</span>
                        <div className="grid grid-cols-2 gap-2">
                            {typeOptions.map(({ value, label, icon: Icon, active }) => (
                                <label
                                    key={value}
                                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                                        type === value ? active : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <input type="radio" value={value} {...register('type')} className="sr-only" />
                                    <Icon size={16} />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                        <input
                            type="number"
                            min={1}
                            {...register('qty', { valueAsNumber: true })}
                            className={inputClass}
                            autoFocus
                        />
                        {errors.qty && <p className="text-xs text-red-600">{errors.qty.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Catatan <span className="font-normal text-gray-400">(opsional)</span>
                        </label>
                        <textarea
                            rows={2}
                            {...register('note')}
                            placeholder="Contoh: Restock dari supplier"
                            className={`${inputClass} resize-none`}
                        />
                        {errors.note && <p className="text-xs text-red-600">{errors.note.message}</p>}
                    </div>

                    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                        <span className="text-gray-500">Stok sekarang → setelah</span>
                        <span className="font-medium tabular-nums text-gray-900">
                            {currentStock} → <span className={stockAfter < 0 ? 'text-red-600' : ''}>{stockAfter}</span>
                        </span>
                    </div>
                </fieldset>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default StockAdjustModal;
