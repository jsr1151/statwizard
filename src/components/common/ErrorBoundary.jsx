import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(_error, errorInfo) {
        this.setState({ errorInfo });
    }

    componentDidUpdate(previousProps) {
        if (
            this.state.hasError
            && previousProps.resetKey !== this.props.resetKey
        ) {
            this.resetBoundary();
        }
    }

    resetBoundary = () => {
        this.props.onReset?.();
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    returnHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });

        if (this.props.onReturnHome) {
            this.props.onReturnHome();
            return;
        }

        window.location.hash = '#/';
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div
                role="alert"
                className="m-4 rounded-2xl border border-rose-500/30 bg-slate-950 p-8 text-slate-200 shadow-xl"
            >
                <h3 className="text-xl font-black text-rose-300">This section could not be displayed.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                    Your other StatWizard pages are still available. Try this section again, reset its temporary state, or return home.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={this.resetBoundary}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
                    >
                        Retry / Reset
                    </button>
                    <button
                        type="button"
                        onClick={this.returnHome}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                    >
                        Return Home
                    </button>
                </div>

                {import.meta.env.DEV && (
                    <details className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
                        <summary className="cursor-pointer font-bold text-slate-300">Development details</summary>
                        <pre className="mt-3 overflow-auto whitespace-pre-wrap">
                            {this.state.error?.toString()}
                            {'\n'}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                )}
            </div>
        );
    }
}

export default ErrorBoundary;
