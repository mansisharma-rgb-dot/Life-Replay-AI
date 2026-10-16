import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class CustomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const CustomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        child: Container(
          height: 66,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(115),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
              BoxShadow(
                color: AppColors.primary.withAlpha(30),
                blurRadius: 18,
                spreadRadius: 1,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark.withAlpha(210),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(
                    color: AppColors.glassBorder.withAlpha(50),
                    width: 1.2,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Row(
                  children: [
                    _buildNavItem(0, Icons.cottage_rounded, 'Home'),
                    _buildNavItem(1, Icons.favorite_rounded, 'Check-in'),
                    _buildNavItem(2, Icons.auto_stories_rounded, 'Journal'),
                    _buildNavItem(3, Icons.flag_rounded, 'Growth'),
                    _buildNavItem(4, Icons.auto_awesome_rounded, 'AI Replay'),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final bool isSelected = currentIndex == index;

    return Expanded(
      flex: isSelected ? 18 : 10,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(index),
          borderRadius: BorderRadius.circular(22),
          splashColor: AppColors.primaryLight.withAlpha(30),
          highlightColor: AppColors.primaryLight.withAlpha(15),
          child: Center(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              padding: EdgeInsets.symmetric(
                horizontal: isSelected ? 10 : 8,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary.withAlpha(64) : Colors.transparent,
                borderRadius: BorderRadius.circular(22),
                border: isSelected
                    ? Border.all(
                        color: AppColors.primaryLight.withAlpha(180),
                        width: 1.2,
                      )
                    : null,
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(75),
                          blurRadius: 12,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: 20,
                    color: isSelected ? AppColors.lavenderGlow : AppColors.textMutedDark,
                  ),
                  if (isSelected) ...[
                    const SizedBox(width: 5),
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          label,
                          maxLines: 1,
                          softWrap: false,
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: AppColors.warmCream,
                            letterSpacing: 0.1,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
