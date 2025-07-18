'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function TambahSoalPage() {
  const searchParams = useSearchParams()
  const latihanSetId = searchParams.get('latihan_set_id')
  const [pertanyaan, setPertanyaan] = useState('')
  const [pilihan, setPilihan] = useState(['', '', '', ''])
  const [jawabanBenar, setJawabanBenar] = useState(1)

  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = uuidv4()

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return alert('Anda harus login terlebih dahulu')
    }

    const { error } = await supabase.from('latihan_soal').insert({
      id,
      id_set: latihanSetId,
      pertanyaan,
      jawaban_1: pilihan[0],
      id_jawaban_1: 1,
      jawaban_2: pilihan[1],
      id_jawaban_2: 2,
      jawaban_3: pilihan[2],
      id_jawaban_3: 3,
      jawaban_4: pilihan[3],
      id_jawaban_4: 4,
      jawaban_benar: jawabanBenar,
      user_id: user.id, 
    })

    if (error) return alert('Gagal menyimpan soal: ' + error.message)
    alert('Soal berhasil disimpan!')
    setPertanyaan('')
    setPilihan(['', '', '', ''])
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={pertanyaan} onChange={e => setPertanyaan(e.target.value)} placeholder="Pertanyaan" required />

      {pilihan.map((p, i) => (
        <input
          key={i}
          value={p}
          onChange={e => {
            const newP = [...pilihan]
            newP[i] = e.target.value
            setPilihan(newP)
          }}
          placeholder={`Jawaban ${i + 1}`}
          required
        />
      ))}

      <select value={jawabanBenar} onChange={e => setJawabanBenar(Number(e.target.value))}>
        {[1, 2, 3, 4].map(num => (
          <option key={num} value={num}>
            Jawaban Benar: {num}
          </option>
        ))}
      </select>

      <button type="submit">Simpan Soal</button>
    </form>
  )
}
