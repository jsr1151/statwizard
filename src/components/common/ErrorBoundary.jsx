import React from 'react';

// --- Error Boundary (DEBUG) ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('ErrorBoundary caught:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, background: '#1e1e2e', color: '#f38ba8', fontFamily: 'monospace', borderRadius: 8, margin: 10 }}>
                    <h3 style={{ color: '#cba6f7' }}>⚠️ Component Crash Caught</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error?.toString()}</pre>
                    <details>
                        <summary style={{ cursor: 'pointer', color: '#a6e3a1' }}>Stack Trace</summary>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, color: '#9399b2' }}>{this.state.errorInfo?.componentStack}</pre>
                    </details>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
