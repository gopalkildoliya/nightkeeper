<?php

namespace App\Http\Controllers;

use App\Models\Environment;
use App\Models\Issue;
use App\Models\NightwatchEvent;
use App\TimeRange;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IssueController extends Controller
{
    public function index(Request $request, Environment $environment): Response
    {
        $range = TimeRange::fromInput($request->query('range'));

        $issues = Issue::query()
            ->where('environment_id', $environment->id)
            ->where('last_seen_at', '>=', $range->since())
            ->orderByDesc('last_seen_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Issue $issue) => $issue->toDashboardArray());

        return Inertia::render('dashboard/issues', [
            'issues' => $issues,
        ]);
    }

    public function show(Request $request, Environment $environment, Issue $issue): Response
    {
        abort_unless($issue->environment_id === $environment->id, 404);

        $range = TimeRange::fromInput($request->query('range'));

        $events = NightwatchEvent::query()
            ->forEnvironment($environment)
            ->ofType('exception')
            ->where('group_hash', $issue->group_hash)
            ->where('occurred_at', '>=', $range->since())
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get()
            ->map(fn (NightwatchEvent $event) => $event->toDashboardArray())
            ->values();

        return Inertia::render('dashboard/issue', [
            'issue' => $issue->toDashboardArray(),
            'events' => $events,
        ]);
    }
}
