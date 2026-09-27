<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\Issue;
use App\Models\NightwatchEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssueController extends Controller
{
    public function index(Environment $environment): Response
    {
        $issues = Issue::query()
            ->where('environment_id', $environment->id)
            ->orderByDesc('last_seen_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Issue $issue) => $issue->toDashboardArray());

        return Inertia::render('dashboard/issues', [
            'issues' => $issues,
        ]);
    }

    public function show(Environment $environment, Issue $issue): Response
    {
        abort_unless($issue->environment_id === $environment->id, 404);

        $events = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('exception')
            ->where('group_hash', $issue->group_hash)
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get();

        return Inertia::render('dashboard/issue', [
            'issue' => $issue->toDashboardArray(),
            'events' => $events->map(fn (NightwatchEvent $event) => $event->toDashboardArray())->values(),
            'exception' => $events->first()?->exceptionDetail(),
        ]);
    }

    public function close(Request $request, Environment $environment, Issue $issue): RedirectResponse
    {
        abort_unless($issue->environment_id === $environment->id, 404);
        abort_unless($request->user()?->can('update', $environment->application->organization), 404);

        $issue->status = 'closed';
        $issue->save();

        return back()->with('success', 'Issue closed.');
    }

    public function reopen(Request $request, Environment $environment, Issue $issue): RedirectResponse
    {
        abort_unless($issue->environment_id === $environment->id, 404);
        abort_unless($request->user()?->can('update', $environment->application->organization), 404);

        $issue->status = 'open';
        $issue->save();

        return back()->with('success', 'Issue reopened.');
    }
}
