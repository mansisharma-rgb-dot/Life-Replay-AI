import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../widgets/custom_nav_bar.dart';
import 'home/home_screen.dart';
import 'checkin/daily_checkin_screen.dart';
import 'journal/journal_screen.dart';
import 'goals/growth_screen.dart';
import 'ai/ai_insights_screen.dart';

class MainNavigationShell extends StatefulWidget {
  final int initialIndex;

  const MainNavigationShell({super.key, this.initialIndex = 0});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  late int _currentIndex;
  DateTime? _lastBackPressTime;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onTabChanged(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;

        // If not on home tab, return to home tab first
        if (_currentIndex != 0) {
          setState(() => _currentIndex = 0);
          return;
        }

        final now = DateTime.now();
        if (_lastBackPressTime == null || now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
          _lastBackPressTime = now;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Press back again to exit Life Replay AI'),
              duration: Duration(seconds: 2),
            ),
          );
          return;
        }

        // Allow exit
        Navigator.of(context).pop();
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundDark,
        body: IndexedStack(
          index: _currentIndex,
          children: [
            HomeScreen(onNavigateTab: _onTabChanged),
            const DailyCheckinScreen(),
            const JournalScreen(),
            const GrowthScreen(),
            const AIInsightsScreen(),
          ],
        ),
        bottomNavigationBar: CustomNavBar(
          currentIndex: _currentIndex,
          onTap: _onTabChanged,
        ),
      ),
    );
  }
}
