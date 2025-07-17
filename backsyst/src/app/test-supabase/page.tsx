import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.from('soal_a2').select('*')

  return (
    <div>
      <h1>Test Supabase Connection</h1>
      {error && <p>Error: {error.message}</p>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
