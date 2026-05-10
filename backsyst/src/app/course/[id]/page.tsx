'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CourseDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [latihanSet, setLatihanSet] = useState<any>(null)
  const [soalList, setSoalList] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  async function fetchData() {
    if (!id) return;
    
    const { data: setData } = await supabase
      .from('latihan_sets')
      .select()
      .eq('id', id)
      .single()

    setLatihanSet(setData)

    const { data: soalData } = await supabase
      .from('latihan_soal')
      .select()
      .eq('id_set', id)

    setSoalList(soalData || [])
  }

  return (
    <div>
      <h1>{latihanSet?.judul}</h1>
      <p>Tingkat: {latihanSet?.tingkat}</p>

      <button onClick={() => router.push(`/course/${id}/created?latihan_set_id=${id}`)}>
        + Tambah Soal
      </button>

      <ul>
        {soalList.map(soal => (
          <li key={soal.id}>{soal.pertanyaan}</li>
        ))}
      </ul>
    </div>
  )
}
