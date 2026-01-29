import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            404
          </span>
        </div>

        <div className="bg-card-bg border border-card-border rounded-2xl p-8 mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">페이지를 찾을 수 없어요</h1>
          <p className="text-muted">
            요청하신 페이지가 존재하지 않거나 이동되었어요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/mentors"
            className="px-6 py-2.5 border border-card-border rounded-full font-medium hover:border-primary hover:text-primary transition-all"
          >
            멘토 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
