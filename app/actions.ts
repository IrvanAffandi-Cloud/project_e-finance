'use server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// PERINGATAN: SERVICE_ROLE_KEY MEMPUNYAI AKSES FULL KE DATABASE. 
// PASTIKAN .env.local LO AMAN.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// MESIN SATPAM INTERNAL (WAJIB ADA)
// ==========================================
async function verifyAkses() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  
  if (!token) throw new Error('AKSES DITOLAK: TOKEN HILANG!')
  
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('AKSES DITOLAK: TOKEN TIDAK VALID!')
  
  return data.user
}

// ==========================================
// MESIN AUTENTIKASI
// ==========================================
export async function loginPemilik(email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
  if (error) return { success: false, message: 'KREDENSIAL SALAH!' }
  
  const cookieStore = await cookies()
  cookieStore.set('sb-access-token', data.session.access_token, { 
    path: '/', maxAge: 60 * 60 * 24 * 7, httpOnly: true, secure: process.env.NODE_ENV === 'production' 
  })
  return { success: true }
}

export async function logoutPemilik() {
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  return { success: true }
}

export async function cekStatusLogin() {
  const cookieStore = await cookies()
  return { success: cookieStore.has('sb-access-token') }
}

// ==========================================
// MESIN RADAR DASHBOARD
// ==========================================
export async function getRadarDashboard() {
  await verifyAkses()
  
  const { data: tx } = await supabase.from('transaksi_harian').select('*, kategori(tipe, nama_kategori)')
  const { data: cicilan } = await supabase.from('cicilan_detail').select('*, cicilan_master!inner(nama_kreditur, cicilan_wajib_per_bulan)').order('tanggal_jatuh_tempo', { ascending: true })
  const { data: utang } = await supabase.from('utang').select('*').order('tanggal_jatuh_tempo', { ascending: true })
  
  return { tx: tx || [], cicilan: cicilan || [], utang: utang || [] }
}

// ==========================================
// MESIN KATEGORI (LENGKAP)
// ==========================================
export async function getKategori() {
  await verifyAkses()
  const { data } = await supabase.from('kategori').select('*').order('nama_kategori', { ascending: true })
  return { kategori: data || [] }
}

export async function getKategoriAll() {
  await verifyAkses()
  const { data } = await supabase.from('kategori').select('*').order('tipe', { ascending: true }).order('nama_kategori', { ascending: true })
  return { kategori: data || [] }
}

export async function tambahKategori(nama: string, tipe: string) {
  await verifyAkses()
  const { error } = await supabase.from('kategori').insert([{ nama_kategori: nama.toUpperCase(), tipe }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function editKategori(id: string, nama: string, tipe: string) {
  await verifyAkses()
  const { error } = await supabase.from('kategori').update({ nama_kategori: nama.toUpperCase(), tipe }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusKategori(id: string) {
  await verifyAkses()
  const { error } = await supabase.from('kategori').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

// ==========================================
// MESIN TRANSAKSI HARIAN
// ==========================================
export async function getTransaksiHarian() {
  await verifyAkses()
  const { data } = await supabase
    .from('transaksi_harian')
    .select('*, kategori(nama_kategori, tipe)')
    .order('waktu_transaksi', { ascending: false })
    .limit(200)
    
  return { transaksi: data || [] }
}

export async function tambahTransaksiHarian(nominal: number, catatan: string, kategori_id: string) {
  await verifyAkses()
  const { error } = await supabase.from('transaksi_harian').insert([{ nominal, catatan, kategori_id }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function editTransaksiHarian(id: string, nominal: number, catatan: string, kategori_id: string) {
  await verifyAkses()
  const { error } = await supabase.from('transaksi_harian').update({ nominal, catatan, kategori_id }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusTransaksiHarian(id: string) {
  await verifyAkses()
  const { error } = await supabase.from('transaksi_harian').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

// ==========================================
// MESIN CICILAN MASTER & DETAIL
// ==========================================
export async function getCicilanMaster() {
  await verifyAkses()
  const { data } = await supabase.from('cicilan_master').select(`*, cicilan_detail(status, nominal_dibayar)`).order('tanggal_mulai', { ascending: false })
  return { cicilan: data || [] }
}

export async function tambahCicilanMaster(nama: string, pinjaman: number, tenor: number, cicilan_bln: number, tgl_mulai: string) {
  await verifyAkses()
  const { data: master, error } = await supabase.from('cicilan_master').insert([{ 
    nama_kreditur: nama.toUpperCase(), 
    total_pinjaman: pinjaman, 
    tenor_bulan: tenor, 
    cicilan_wajib_per_bulan: cicilan_bln, 
    tanggal_mulai: tgl_mulai 
  }]).select().single()
  
  if (error) return { success: false, message: error.message }

  const detailRows = []
  const startDate = new Date(tgl_mulai)
  for (let i = 1; i <= tenor; i++) {
    const tempoDate = new Date(startDate)
    tempoDate.setMonth(startDate.getMonth() + (i - 1))
    detailRows.push({
      cicilan_id: master.id,
      bulan_ke: i,
      tanggal_jatuh_tempo: tempoDate.toISOString(),
      nominal_dibayar: 0,
      status: 'BELUM BAYAR'
    })
  }
  await supabase.from('cicilan_detail').insert(detailRows)
  return { success: true }
}

export async function editCicilanMaster(id: string, nama: string, pokok: number, cicilan_bln: number) {
  await verifyAkses()
  const { error } = await supabase.from('cicilan_master').update({ 
    nama_kreditur: nama.toUpperCase(), 
    total_pinjaman: pokok, 
    cicilan_wajib_per_bulan: cicilan_bln 
  }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusCicilanMaster(id: string) {
  await verifyAkses()
  await supabase.from('cicilan_detail').delete().eq('cicilan_id', id)
  const { error } = await supabase.from('cicilan_master').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function getCicilanDetail(id: string) {
  await verifyAkses()
  const { data: master } = await supabase.from('cicilan_master').select('*').eq('id', id).single()
  const { data: detail } = await supabase.from('cicilan_detail').select('*').eq('cicilan_id', id).order('bulan_ke', { ascending: true })
  return { master, detail: detail || [] }
}

export async function setorCicilan(detail_id: string, nominal: number, wajib: number) {
  await verifyAkses()
  let status = 'BELUM BAYAR'
  if (nominal >= wajib) status = 'LUNAS'
  else if (nominal > 0) status = 'KURANG'

  const { error } = await supabase.from('cicilan_detail').update({ 
    nominal_dibayar: nominal, 
    tanggal_bayar: new Date().toISOString(), 
    status 
  }).eq('id', detail_id)
  return error ? { success: false, message: error.message } : { success: true }
}

// ==========================================
// MESIN UTANG PRIBADI
// ==========================================
export async function tambahUtang(nama: string, sisa_utang: number, tanggal_jatuh_tempo: string) {
  await verifyAkses()
  const { error } = await supabase.from('utang').insert([{ 
    nama_kreditur: nama.toUpperCase(), 
    sisa_utang, 
    tanggal_jatuh_tempo,
    status: 'BELUM LUNAS'
  }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function editUtang(id: string, nama: string, sisa_utang: number, tanggal_jatuh_tempo: string) {
  await verifyAkses()
  const { error } = await supabase.from('utang').update({ 
    nama_kreditur: nama.toUpperCase(), 
    sisa_utang, 
    tanggal_jatuh_tempo 
  }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function bayarUtang(id: string, sisa_sekarang: number, nominal_bayar: number) {
  await verifyAkses()
  const sisa_baru = sisa_sekarang - nominal_bayar
  const status = sisa_baru <= 0 ? 'LUNAS' : 'BELUM LUNAS'
  
  const { error } = await supabase.from('utang').update({ 
    sisa_utang: sisa_baru < 0 ? 0 : sisa_baru, 
    status 
  }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusUtang(id: string) {
  await verifyAkses()
  const { error } = await supabase.from('utang').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}