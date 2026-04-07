import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button.jsx'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-zinc-800 mb-2">페이지를 찾을 수 없어요</h1>
        <p className="text-zinc-500 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        <Link to="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </div>
    </div>
  )
}
