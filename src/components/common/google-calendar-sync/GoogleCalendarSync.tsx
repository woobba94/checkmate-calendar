import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const GoogleCalendarSync: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSync = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      // current user id
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인 필요')
      }

      // 동기화 Edge Function 호출
      const { error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { user_id: user.id }
      })

      if (error) throw error

      setMessage('동기화 완료')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생..'
      setMessage(`오류: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button onClick={handleSync} disabled={isLoading}>
        {isLoading ? '동기화 중...' : '구글 캘린더 동기화'}
      </button>
      {message && (
        <p>{message}</p>
      )}
    </div>
  )
}

export default GoogleCalendarSync;