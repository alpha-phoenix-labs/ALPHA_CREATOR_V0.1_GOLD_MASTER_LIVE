from backend.app.alpha_connector.interface import AlphaEvent


class NoopAlphaConnector:
    """V0.1 boundary: deliberately performs no external ALPHA ENGINE calls."""

    async def publish(self, event: AlphaEvent) -> None:
        return None

    async def health(self) -> dict[str, str]:
        return {"status": "not_configured", "mode": "standalone"}

