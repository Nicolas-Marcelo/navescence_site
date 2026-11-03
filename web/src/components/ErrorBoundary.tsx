import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(
    error: Error,
    info: ErrorInfo,
  ) {
    console.error(
      "[REACT] Erro não tratado:",
      error,
      info,
    );
  }

  private reload = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="page-center">
        <section className="auth-card center">
          <AlertTriangle
            size={42}
            aria-hidden="true"
          />

          <span className="eyebrow">
            Erro inesperado
          </span>

          <h1>
            Algo deu errado
          </h1>

          <p className="muted">
            O NAVESCENCE encontrou um
            erro inesperado ao carregar
            esta página.
          </p>

          <p className="muted">
            Nenhuma informação técnica
            sensível foi exibida.
          </p>

          <button
            type="button"
            className="button primary"
            onClick={this.reload}
          >
            <RefreshCw size={17} />

            Voltar ao início
          </button>
        </section>
      </main>
    );
  }
}