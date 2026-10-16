import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_assets.dart';
import '../../providers/ai_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/loading_view.dart';
import '../../widgets/error_state_view.dart';
import '../../widgets/atmospheric_background.dart';

class AIInsightsScreen extends StatefulWidget {
  const AIInsightsScreen({super.key});

  @override
  State<AIInsightsScreen> createState() => _AIInsightsScreenState();
}

class _AIInsightsScreenState extends State<AIInsightsScreen> {
  final TextEditingController _queryController = TextEditingController();

  final List<String> _suggestedQueries = [
    'How has my mood evolved lately?',
    'What days had my highest focus?',
    'What habits need more love?',
    'Show me my calm moments',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AIProvider>().fetchAIOverview();
    });
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  void _sendQuery(String query) {
    _queryController.text = query;
    context.read<AIProvider>().queryReplay(query);
  }

  @override
  Widget build(BuildContext context) {
    final aiProvider = context.watch<AIProvider>();
    final overview = aiProvider.overview;
    final replayResult = aiProvider.replayResult;

    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      appBar: AppBar(
        title: const Text('AI Growth & Replay'),
      ),
      body: AtmosphericBackground(
        showStars: true,
        showNebulaGlow: true,
        child: SafeArea(
          child: RefreshIndicator(
          color: AppColors.primaryLight,
          backgroundColor: AppColors.surfaceDark,
          onRefresh: () => aiProvider.fetchAIOverview(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // AI Companion Hero Card
                _buildCompanionHero(),
                const SizedBox(height: 12),

                // Freshness & Privacy Indicator
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDark.withAlpha(150),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderDark),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.lock_outline_rounded, size: 14, color: AppColors.accentMint),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Evaluated securely on your real journal & routine history. Never shared.',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondaryDark),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Replay Query Input Box
                _buildQueryBox(aiProvider),
                const SizedBox(height: 16),

                // Query Result / Replay Card
                if (aiProvider.isQueryingReplay)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: LoadingView(message: 'Generating your Life Replay analysis...'),
                  )
                else if (aiProvider.replayError != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: ErrorStateView(
                      message: aiProvider.replayError!,
                      onRetry: () => _sendQuery(_queryController.text),
                    ),
                  )
                else if (replayResult != null) ...[
                  _buildReplayResultCard(replayResult, aiProvider),
                  const SizedBox(height: 22),
                ],

                // Growth Insights & Recommendations Section
                const Text(
                  'Personalized Growth Insights',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryDark,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 12),

                if (aiProvider.isLoadingOverview)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 30),
                    child: LoadingView(message: 'Gathering your personalized insights...'),
                  )
                else if (overview == null || overview.insights.isEmpty)
                  _buildEmptyInsights()
                else ...[
                  ...overview.insights.map((insight) => _buildInsightCard(insight)),
                  const SizedBox(height: 20),
                  if (overview.recommendations.isNotEmpty) ...[
                    const Text(
                      'AI Recommendations',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimaryDark,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...overview.recommendations.map((rec) => _buildRecommendationCard(rec)),
                  ],
                ],
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

  Widget _buildCompanionHero() {
    return AppCard(
      hasGlow: true,
      gradient: const LinearGradient(
        colors: [Color(0xFF2E1545), Color(0xFF1B122F)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primaryLight.withAlpha(120), width: 2),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withAlpha(80),
                  blurRadius: 18,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset(AppAssets.aiHelper, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Life Replay Intelligence',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimaryDark,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Ask about your thoughts, routines, and emotional milestones.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondaryDark,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQueryBox(AIProvider provider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppColors.surfaceDark,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.borderDark, width: 1.2),
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              const Icon(Icons.psychology_rounded, color: AppColors.primaryLight, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _queryController,
                  style: const TextStyle(color: AppColors.textPrimaryDark, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Ask your Replay AI...',
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) provider.queryReplay(val.trim());
                  },
                ),
              ),
              IconButton(
                icon: const Icon(Icons.arrow_upward_rounded, color: AppColors.primaryLight),
                onPressed: () {
                  final text = _queryController.text.trim();
                  if (text.isNotEmpty) provider.queryReplay(text);
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Suggestion Chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _suggestedQueries.map((query) {
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(
                    query,
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondaryDark),
                  ),
                  backgroundColor: AppColors.surfaceLightDark,
                  side: const BorderSide(color: AppColors.borderDark),
                  onPressed: () => _sendQuery(query),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildReplayResultCard(dynamic result, AIProvider provider) {
    return AppCard(
      hasGlow: true,
      gradient: const LinearGradient(
        colors: [Color(0xFF22183B), Color(0xFF171329)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.auto_awesome, color: AppColors.primaryLight, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Replay Reflection',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryLight,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: AppColors.textMutedDark, size: 18),
                onPressed: () => provider.clearReplay(),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            result.answer,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textPrimaryDark,
              height: 1.6,
            ),
          ),
          if (result.memories.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Divider(color: AppColors.borderDark),
            const SizedBox(height: 8),
            const Text(
              'Related Memories Retrieved:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textSecondaryDark,
              ),
            ),
            const SizedBox(height: 8),
            ...result.memories.take(3).map((mem) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.history_rounded, size: 14, color: AppColors.primaryLight),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${mem['date'] ?? ''}: ${mem['title'] ?? mem['mood_label'] ?? 'Check-in'}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textMutedDark),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildInsightCard(dynamic insight) {
    Color badgeColor = AppColors.primaryLight;
    if (insight.category == 'strength') {
      badgeColor = AppColors.accentMint;
    } else if (insight.category == 'weakness') {
      badgeColor = const Color(0xFFEF4444);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor.withAlpha(35),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: badgeColor.withAlpha(80)),
                  ),
                  child: Text(
                    insight.category.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: badgeColor,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  insight.priority.toUpperCase(),
                  style: const TextStyle(fontSize: 10, color: AppColors.textMutedDark),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              insight.title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              insight.message,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondaryDark,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendationCard(dynamic rec) {
    Color priorityColor = AppColors.primaryLight;
    if (rec.priority == 'high') {
      priorityColor = const Color(0xFFF59E0B);
    } else if (rec.priority == 'urgent') {
      priorityColor = const Color(0xFFEF4444);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withAlpha(25),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.lightbulb_outline_rounded, color: AppColors.secondary, size: 18),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLightDark,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderDark),
                    ),
                    child: Text(
                      rec.category.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondaryDark,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: priorityColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: priorityColor.withAlpha(80)),
                  ),
                  child: Text(
                    '${rec.priority.toUpperCase()} PRIORITY',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: priorityColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              rec.title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimaryDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              rec.action,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondaryDark,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyInsights() {
    return AppCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(AppAssets.celestialMoon, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Insights are Generating',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimaryDark,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Keep checking in each day. As your patterns emerge, Life Replay AI provides personalized growth guidance.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondaryDark,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
