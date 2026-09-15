import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without this, an uncaught render error leaves the page fully blank with no
 * indication anything went wrong — especially hard to diagnose on iOS Safari,
 * where there's no easy way for most users to open the console.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Đã có lỗi xảy ra</h2>
        <p style={{ color: '#666', marginBottom: 16 }}>
          Vui lòng tải lại trang. Nếu lỗi lặp lại, chụp lại nội dung bên dưới và gửi cho người hỗ
          trợ.
        </p>
        <pre
          style={{
            maxWidth: '90vw',
            overflow: 'auto',
            textAlign: 'left',
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          {error.message}
          {'\n'}
          {error.stack}
        </pre>
        <button
          style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </button>
      </div>
    );
  }
}
