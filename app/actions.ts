'use server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function loginPemilik(pin: string) {
  if (pin !== '123456') return { success: false, message: 'PIN BRANKAS SALAH!' }
  const cookieStore = await cookies()
  cookieStore.set('finance_session', 'true', { path: '/', maxAge: 86400 * 7, httpOnly: true })
  return { success: true }
}

export async function logoutPemilik() {
  const cookieStore = await cookies()
  cookieStore.delete('finance_session')
  return { success: true }
}

export async function getDashboardKas() {
  const { data } = await supabase.from('transaksi').select('*, kategori(id, nama, tipe)').order('tanggal', { ascending: false })
  return { transaksi: data || [] }
}

export async function getKategori() {
  const { data } = await supabase.from('kategori').select('*').order('nama', { ascending: true })
  return { kategori: data || [] }
}

export async function tambahTransaksi(nominal: number, catatan: string, kategori_id: string) {
  const { error } = await supabase.from('transaksi').insert([{ nominal, catatan, kategori_id }])
  if (error) return { success: false, message: error.message }
  return { success: true }
}

// EKSEKUSI BARU: FUNGSI EDIT
export async function editTransaksi(id: string, nominal: number, catatan: string, kategori_id: string) {
  const { error } = await supabase.from('transaksi').update({ nominal, catatan, kategori_id }).eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

// EKSEKUSI BARU: FUNGSI HAPUS
export async function hapusTransaksi(id: string) {
  const { error } = await supabase.from('transaksi').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

