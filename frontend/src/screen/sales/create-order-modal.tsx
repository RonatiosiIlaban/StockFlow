import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import Modal from '../../components/modal';
import { getProducts, type Product } from '../../services/products';
import { createSalesOrder } from '../../services/sales';
import { rupiah } from './shared';

type CreateOrderModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
};

const buildSchema = (productsById: Map<number, Product>) =>
    yup.object({
        customer: yup.string().trim().required('Nama customer wajib diisi'),
        items: yup
            .array(
                yup.object({
                    product_id: yup.number().required(),
                    qty: yup
                        .number()
                        .typeError('Qty wajib diisi')
                        .integer('Qty harus bilangan bulat')
                        .min(1, 'Qty minimal 1')
                        .required('Qty wajib diisi')
                        .test('stock', function (value) {
                            const product = productsById.get(this.parent.product_id);
                            if (!product || value === undefined) return true;
                            return value <= product.stock
                                ? true
                                : this.createError({ message: `Stok tersedia ${product.stock}` });
                        }),
                }),
            )
            .min(1, 'Pilih minimal 1 produk')
            .required(),
    });

type FormValues = yup.InferType<ReturnType<typeof buildSchema>>;

const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900';

const CreateOrderModal = ({ isOpen, onClose, onSuccess, onError }: CreateOrderModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    // Satu key per "sesi" modal: kalau submit diulang (double click / retry), backend tidak membuat order dobel
    const idempotencyKey = useRef('');

    const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: yupResolver(buildSchema(productsById)),
        defaultValues: { customer: '', items: [] },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    // Setiap modal dibuka: reset form, buat key baru, ambil produk aktif
    useEffect(() => {
        if (!isOpen) return;
        reset({ customer: '', items: [] });
        idempotencyKey.current = crypto.randomUUID();

        setLoadingProducts(true);
        getProducts({ page: 1, limit: 100, is_active: true })
            .then((res) => setProducts(res.data ?? []))
            .catch(() => onError('Gagal memuat daftar produk'))
            .finally(() => setLoadingProducts(false));
    }, [isOpen, reset, onError]);

    const items = watch('items');
    const selectedIds = new Set(items.map((i) => i.product_id));
    const availableProducts = products.filter((p) => !selectedIds.has(p.id) && p.stock > 0);

    const total = items.reduce((sum, i) => {
        const product = productsById.get(i.product_id);
        const qty = Number.isFinite(i.qty) ? i.qty : 0;
        return sum + (product ? product.price * qty : 0);
    }, 0);

    const onSubmit = async (values: FormValues) => {
        try {
            const res = await createSalesOrder(
                {
                    customer: values.customer,
                    items: values.items.map((i) => {
                        const product = productsById.get(i.product_id)!;
                        return { sku: product.sku, qty: i.qty, unit_price: product.price };
                    }),
                },
                idempotencyKey.current,
            );
            onSuccess(`Sales order #${res.data.id} untuk "${values.customer}" berhasil dibuat`);
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message ?? 'Gagal membuat sales order'
                : 'Gagal membuat sales order';
            onError(message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} size="lg">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-6">
                <h3 className="text-lg font-medium text-gray-900">Buat Sales Order</h3>

                <fieldset disabled={isSubmitting} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Nama Customer</label>
                        <input {...register('customer')} placeholder="Contoh: Budi" className={inputClass} autoFocus />
                        {errors.customer && <p className="text-xs text-red-600">{errors.customer.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Tambah Produk</label>
                        <select
                            value=""
                            onChange={(e) => {
                                const id = Number(e.target.value);
                                if (id) append({ product_id: id, qty: 1 });
                            }}
                            disabled={loadingProducts || availableProducts.length === 0}
                            className={`${inputClass} bg-white disabled:bg-gray-50 disabled:text-gray-400`}
                        >
                            <option value="">
                                {loadingProducts
                                    ? 'Memuat produk...'
                                    : availableProducts.length === 0
                                      ? 'Tidak ada produk lain yang tersedia'
                                      : 'Pilih produk...'}
                            </option>
                            {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku}) · {rupiah.format(p.price)} · stok {p.stock}
                                </option>
                            ))}
                        </select>
                        {errors.items?.message && <p className="text-xs text-red-600">{errors.items.message}</p>}
                    </div>

                    {fields.length > 0 && (
                        <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
                            <div className="grid grid-cols-[1fr_7rem_2rem] gap-3 bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                <span>Produk</span>
                                <span className="text-right">Qty</span>
                                <span />
                            </div>
                            {fields.map((field, index) => {
                                const product = productsById.get(field.product_id);
                                const qtyError = errors.items?.[index]?.qty?.message;
                                return (
                                    <div key={field.id} className="grid grid-cols-[1fr_7rem_2rem] items-start gap-3 px-3 py-2">
                                        <div className="min-w-0 py-1">
                                            <p className="truncate text-sm font-medium text-gray-900">{product?.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {product && rupiah.format(product.price)} · stok {product?.stock}
                                            </p>
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                min={1}
                                                max={product?.stock}
                                                {...register(`items.${index}.qty`, { valueAsNumber: true })}
                                                className={`${inputClass} text-right tabular-nums`}
                                            />
                                            {qtyError && <p className="mt-1 text-right text-xs text-red-600">{qtyError}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            aria-label={`Hapus ${product?.name}`}
                                            className="mt-1.5 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                            <div className="flex justify-between px-3 py-2 text-sm">
                                <span className="text-gray-500">Total</span>
                                <span className="font-semibold tabular-nums text-gray-900">{rupiah.format(total)}</span>
                            </div>
                        </div>
                    )}
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
                        {isSubmitting ? 'Menyimpan...' : 'Buat Order'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateOrderModal;
