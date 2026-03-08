'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            alert(error.message)
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    const handleSignUp = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: email.split('@')[0] // Default name
                }
            }
        })
        if (error) alert(error.message)
        else alert('Check your email for the confirmation link!')
        setLoading(false)
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background p-4">
            <div className="glass w-full max-w-md space-y-8 rounded-xl p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">NegociosSaaS</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? 'Processing...' : 'Sign in'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="btn btn-ghost w-full"
                        >
                            Create account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
