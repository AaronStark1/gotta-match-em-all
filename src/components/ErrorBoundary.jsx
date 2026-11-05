import { Component } from "react";
import RetroErrorBox from "./RetroErrorBox";

/**
 * Catches unexpected render errors anywhere below it and shows the retro
 * error box instead of a blank screen. Changing `resetKey` (the route path)
 * clears the error, so navigating Home recovers automatically.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error("Unexpected error:", error, info?.componentStack);
  }

  componentDidUpdate(_prevProps, prevState) {
    // The focused Retry button unmounted with the error box; move focus to the
    // recovered page's main heading instead of leaving it on <body>.
    if (prevState.error && !this.state.error) {
      const heading = document.querySelector("h1");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    }
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <RetroErrorBox
          title="Game crashed!"
          message="Something unexpected happened. Try again, Trainer!"
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
