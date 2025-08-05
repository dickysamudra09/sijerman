'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/course/new')
    }
  }

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          username,
        },
      },
     })
    if (error) {
      setError(error.message)
    } else {
      router.push('/course/new')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={e => { e.preventDefault(); handleLogin() }} className="space-y-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={e => { e.preventDefault(); handleRegister() }} className="space-y-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">Register</Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
