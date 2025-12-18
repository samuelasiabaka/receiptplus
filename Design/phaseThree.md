You are now designing Phase 3 of the app.

PHASE:
Phase 3 — Accounts, Backend & Monetization

BACKEND STACK (LOCKED):
- C#
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server or PostgreSQL
- JWT authentication

FRONTEND:
- React Native (Expo)
- Secure API communication

FEATURES:
- User authentication
- Cloud backup & sync
- Subscription management
- Multi-device access
- Receipt & profile sync

PAYMENTS:
- Nigerian payment gateways (Paystack or Flutterwave)

EXPECTED OUTPUT:
- Clean ASP.NET Core API architecture
- Database schema
- Auth flow (JWT)
- API contracts
- Frontend integration guidance

STRICT RULES:
- No monolithic controllers
- No business logic in controllers
- Use DTOs
- Explain security decisions


[ApiController]
[Route("api/receipts")]
public class ReceiptsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetReceipts()
    {
        return Ok();
    }
}
