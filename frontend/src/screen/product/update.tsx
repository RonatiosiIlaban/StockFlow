import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';
import Toast from '../../components/toats';
import RupiahInput from '../../components/rupiah-input';
import { getProductById, updateProduct, type Product } from '../../services/products';

const schema = yup.object({
    sku: yup.string().trim().required('SKU wajib diisi').max(100, 'SKU maksimal 100 karakter'),
    name: yup.string().trim().required('Nama wajib diisi').min(3, 'Nama minimal 3 karakter'),
    price: yup
        .number()
        .typeError('Harga wajib diisi')
        .integer('Harga harus bilangan bulat')
        .min(0, 'Harga tidak boleh negatif')
        .required('Harga wajib diisi'),
    is_active: yup.boolean().defined(),
});

type FormValues = yup.InferType<typeof schema>;

type ToastState = { open: boolean; message: string; severity: 'success' | 'error' };

const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500';

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {children}
        {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
);

const UpdateProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product>();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<FormValues>({
        resolver: yupResolver(schema),
        defaultValues: { sku: '', name: '', price: 0, is_active: true },
    });

    const loadDetailProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getProductById(id);
            setProduct(res.data);
            reset({
                sku: res.data.sku,
                name: res.data.name,
                price: res.data.price,
                is_active: res.data.is_active,
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            setToast({ open: true, message: 'Gagal memuat produk', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id, reset]);

    useEffect(() => {
        loadDetailProduct();
    }, [loadDetailProduct]);

    const onSubmit = async (values: FormValues) => {
        if (!product) return;
        try {
            // Stok tidak diubah dari form ini, kirim nilai yang sekarang.
            await updateProduct(product.id, { ...values, stock: product.stock });
            setToast({ open: true, message: 'Produk berhasil diperbarui', severity: 'success' });
            setTimeout(() => navigate('/products'), 800);
        } catch (error) {
            let message = 'Gagal memperbarui produk';
            if (axios.isAxiosError(error)) {
                const body = error.response?.data;
                // Error validasi dari backend berbentuk { Sku: "...", Name: "..." }
                if (body?.data && typeof body.data === 'object') {
                    Object.entries(body.data as Record<string, string>).forEach(([field, msg]) => {
                        setError(field.toLowerCase() as keyof FormValues, { message: msg });
                    });
                }
                message = body?.message ?? message;
            }
            setToast({ open: true, message, severity: 'error' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Edit Produk</h1>
                    <p className="text-sm text-gray-500">{product ? product.sku : 'Memuat...'}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeft size={16} />
                    Kembali
                </button>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="w-full px-12 space-y-4 rounded-lg border border-gray-200 bg-white p-6"
            >
                <fieldset disabled={loading || isSubmitting} className="space-y-4">
                    <Field label="SKU" error={errors.sku?.message}>
                        <input {...register('sku')} className={inputClass} />
                    </Field>

                    <Field label="Nama" error={errors.name?.message}>
                        <input {...register('name')} className={inputClass} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Harga" error={errors.price?.message}>
                            <RupiahInput control={control} name="price" className={inputClass} />
                        </Field>

                        <Field label="Stok">
                            <div className="flex h-[38px] items-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 text-sm tabular-nums text-gray-700">
                                {product?.stock ?? '-'}
                            </div>
                            <p className="text-xs text-gray-400">Hanya bisa diubah lewat "Atur Stok" di daftar produk</p>
                        </Field>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" {...register('is_active')} className="h-4 w-4 rounded border-gray-300" />
                        Produk aktif
                    </label>
                </fieldset>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                    <button
                        type="submit"
                        disabled={loading || isSubmitting || !isDirty}
                        className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
            />
        </div>
    );
};

export default UpdateProduct;
