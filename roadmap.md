# ScamSathi live integration
- [x] Connect the existing analyzer to the saved-secret Gemini function; remove keyword/demo output.
- [x] Preserve the design and provide loading, failure, and accurate privacy messaging.
- [x] Exercise both sample messages through the UI, verify error recovery and browser secret isolation; three automated tests pass.
- [ ] Verify successful live results for both samples — blocked by Gemini 503 responses and timeouts on Google's recommended gemini-3.8-flash model; older models reject this account with 404.