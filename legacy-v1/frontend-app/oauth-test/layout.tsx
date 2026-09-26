import { ReactNode } from 'react'
import OAuthLayout from '../layout.oauth'

export default function OAuthTestLayout({ children }: { children: ReactNode }) {
  return <OAuthLayout>{children}</OAuthLayout>
}
