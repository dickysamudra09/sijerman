'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export default function CreateCourse() {
  const [judul, setJudul] = useState('')
  const [tingkat, setTingkat] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return alert('Anda harus login terlebih dahulu')
    }

    const id = uuidv4()
    const { data, error } = await supabase
      .from('latihan_sets')
      .insert({ 
        id, 
        judul, 
        tingkat,
        user_id: user.id 
      })
      .select()
      .single()

    if (error) return alert('Gagal membuat latihan set: ' + error.message)

    router.push(`/course/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Judul" required />
      <input value={tingkat} onChange={e => setTingkat(e.target.value)} placeholder="Tingkat" required />
      <button type="submit">Buat Latihan Set</button>
    </form>
  )
}