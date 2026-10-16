import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:life_replay_ai/widgets/custom_nav_bar.dart';
import 'package:life_replay_ai/widgets/app_button.dart';
import 'package:life_replay_ai/widgets/app_card.dart';
import 'package:life_replay_ai/widgets/mood_badge.dart';
import 'package:life_replay_ai/widgets/stat_pill.dart';
import 'package:life_replay_ai/core/constants/app_colors.dart';

void main() {
  group('Responsive Layout & Overflow Tests', () {
    testWidgets('CustomNavBar renders all 5 tabs without overflow on 320px narrow screen', (tester) async {
      // 320px width (e.g. iPhone SE 1st gen / small Android)
      tester.view.physicalSize = const Size(320, 640);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      for (int i = 0; i < 5; i++) {
        await tester.pumpWidget(
          MaterialApp(
            theme: ThemeData.dark(),
            home: Scaffold(
              bottomNavigationBar: CustomNavBar(
                currentIndex: i,
                onTap: (_) {},
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'CustomNavBar overflowed when tab $i is selected');
      }
    });

    testWidgets('CustomNavBar handles 1.5x accessibility text scale without overflow', (tester) async {
      tester.view.physicalSize = const Size(360, 740);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: MediaQuery(
            data: const MediaQueryData(
              size: Size(360, 740),
              textScaler: TextScaler.linear(1.5),
            ),
            child: Scaffold(
              bottomNavigationBar: CustomNavBar(
                currentIndex: 4, // 'AI Replay' longest tab
                onTap: (_) {},
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('AppButton handles long text on narrow width without RenderFlex overflow', (tester) async {
      tester.view.physicalSize = const Size(320, 480);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: Scaffold(
            body: Center(
              child: SizedBox(
                width: 200,
                child: AppButton(
                  text: 'Extremely Long Action Button Text That Must Scale Down Rather Than Overflow',
                  onPressed: () {},
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('StatPill and MoodBadge render cleanly on 320px narrow screens', (tester) async {
      tester.view.physicalSize = const Size(320, 568);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: const [
                      Expanded(child: StatPill(label: 'Total Streak', value: '42 Days', icon: Icons.local_fire_department)),
                      SizedBox(width: 8),
                      Expanded(child: StatPill(label: 'Average Score', value: '94/100', icon: Icons.star_rounded)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      MoodBadge(moodScore: 6, label: 'Calm'),
                      MoodBadge(moodScore: 8, label: 'Joyful'),
                      MoodBadge(moodScore: 9, label: 'Productive'),
                      MoodBadge(moodScore: 5, label: 'Reflective'),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('AppCard with glassmorphism and nested responsive rows renders without overflow', (tester) async {
      tester.view.physicalSize = const Size(320, 568);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: Scaffold(
            body: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: AppCard(
                isGlass: true,
                hasGlow: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              'Personal Growth Narrative & Reflection',
                              maxLines: 1,
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withAlpha(40),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('AI Verified', style: TextStyle(fontSize: 10)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Comprehensive weekly reflection tracking mood, habits, focus, and energy with deep AI insights.',
                      style: TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
