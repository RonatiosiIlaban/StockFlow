import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { ArrowLeft, Save } from 'lucide-react';
import Toast from '../../components/toats';
import RupiahInput from '../../components/rupiah-input';
import { createProduct } from '../../services/products';

const schema = yup.object({
    sku: yup.string().trim().required('SKU wajib diisi').max(100, 'SKU maksimal 100 karakter'),
    name: yup.string().trim().required('Nama wajib diisi').min(3, 'Nama minimal 3 karakter'),
    price: yup
        .number()
        .typeError('Harga wajib diisi')
        .integer('Harga harus bilangan bulat')
        .min(0, 'Harga tidak boleh negatif')
        .required('Harga wajib diisi'),
    stock: yup
        .number()
        .typeError('Stok awal wajib diisi')
        .integer('Stok harus bilangan bulat')
        .min(0, 'Stok tidak boleh negatif')
        .required('Stok awal wajib diisi'),
    is_active: yup.boolean().defined(),
});

type FormValues = yup.InferType<typeof schema>;

type ToastState = { open: boolean; message: string; severity: 'success' | 'error' };

const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500';

const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) => (
    <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {children}
        {error ? (
            <p className="text-xs text-red-600">{error}</p>
        ) : (
            hint && <p className="text-xs text-gray-400">{hint}</p>
        )}
    </div>
);

const CreateProduct = () => {
    const navigate = useNavigate();
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: yupResolver(schema),
        defaultValues: { sku: '', name: '', price: 0, stock: 0, is_active: true },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await createProduct(values);
            setToast({ open: true, message: `Produk "${values.name}" berhasil ditambahkan`, severity: 'success' });
            setTimeout(() => navigate('/products'), 800);
        } catch (error) {
            let message = 'Gagal menambahkan produk';
            if (axios.isAxiosError(error)) {
                const body = error.response?.data;
                // Error validasi dari backend berbentuk { Sku: "...", Name: "..." }
                if (body?.data && typeof body.data === 'object') {
                    Object.entries(body.data as Record<string, string>).forEach(([field, msg]) => {
                        setError(field.toLowerCase() as keyof FormValues, { message: msg });
                    });
                }
                message = body?.message ?? message;
                // Backend: "sku sudah digunakan" -> tampilkan juga di bawah field SKU
                if (typeof message === 'string' && message.toLowerCase().includes('sku')) {
                    setError('sku', { message });
                }
            }
            setToast({ open: true, message, severity: 'error' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Tambah Produk</h1>
                    <p className="text-sm text-gray-500">Isi data produk baru</p>
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
                className="w-full space-y-4 rounded-lg border border-gray-200 bg-white p-6 px-12"
            >
                <fieldset disabled={isSubmitting} className="space-y-4">
                    <Field label="SKU" error={errors.sku?.message}>
                        <input {...register('sku')} placeholder="Contoh: SKU-001" className={inputClass} />
                    </Field>

                    <Field label="Nama" error={errors.name?.message}>
                        <input {...register('name')} placeholder="Nama produk" className={inputClass} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Harga" error={errors.price?.message}>
                            <RupiahInput control={control} name="price" className={inputClass} />
                        </Field>

                        <Field
                            label="Stok Awal"
                            error={errors.stock?.message}
                            hint="Setelah dibuat, ubah stok lewat stock movement"
                        >
                            <input
                                type="number"
                                min={0}
                                {...register('stock', { valueAsNumber: true })}
                                className={inputClass}
                            />
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
                        disabled={isSubmitting}
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

export default CreateProduct;
