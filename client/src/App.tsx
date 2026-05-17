import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Library from "./pages/Library";
import BookDetail from "./pages/BookDetail";
import ReviewSubmit from "./pages/ReviewSubmit";
import Community from "./pages/Community";
import Destinations from "./pages/Destinations";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminNewsletterSubscribers from "./pages/AdminNewsletterSubscribers";
import AdminPayments from "./pages/AdminPayments";
import Orders from "./pages/Orders";
import ManualPayment from "./pages/ManualPayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PayFastCheckout from "./pages/PayFastCheckout";
import Cart from "./pages/Cart";
import ProfileCompletion from "./pages/ProfileCompletion";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/library"} component={Library} />
      <Route path={"/book/:id"} component={BookDetail} />
      <Route path={"/book/:bookId/review"} component={ReviewSubmit} />
      <Route path={"/community"} component={Community} />
      <Route path={"/destinations"} component={Destinations} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/profile-completion"} component={ProfileCompletion} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin/newsletter"} component={AdminNewsletterSubscribers} />
      <Route path={"/admin/payments"} component={AdminPayments} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/payment"} component={ManualPayment} />
      <Route path={"/payfast-checkout"} component={PayFastCheckout} />
      <Route path={"/cart"} component={Cart} />
      <Route path={"/success"} component={PaymentSuccess} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
