import Header from './components/Header'
import CapturePage from './pages/CapturePage'
import EditorPage from './pages/EditorPage'
import ResultPage from './pages/ResultPage'
import WelcomePage from './pages/WelcomePage'
import { PhotoboothProvider, usePhotobooth } from './store'

function Pages() {
  const { state } = usePhotobooth()
  return (
    <div className={state.step === 'editor' ? 'relative flex min-h-dvh flex-col overflow-visible lg:h-dvh lg:min-h-0 lg:overflow-hidden' : 'relative flex min-h-screen flex-col'}>
      <div className="editorial-grid" aria-hidden="true"><span /><span /><span /><span /></div>
      <Header />
      {state.step === 'welcome' && <WelcomePage />}
      {state.step === 'capture' && <CapturePage />}
      {state.step === 'editor' && <EditorPage />}
      {state.step === 'result' && <ResultPage />}
    </div>
  )
}

export default function App() {
  return <PhotoboothProvider><Pages /></PhotoboothProvider>
}
