<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All message analysis goes through `analyzeMessage()` in `src/lib/analysis.ts` returning `AnalysisResult`; swap the demo body for a server function call to go live, so UI never changes and keys stay server-side.
- UI strings live in `src/lib/i18n.ts` (en / roman / ur); components never hardcode copy, so all three languages stay in sync.
