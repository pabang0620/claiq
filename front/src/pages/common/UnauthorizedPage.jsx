import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <ShieldOff size={64} className="text-primary-300" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-800 mb-2">접근 권한이 없어요</h1>
        <p className="text-zinc-500 mb-8">이 페이지에 접근할 권한이 없습니다.</p>
        <Link to="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  )
}
