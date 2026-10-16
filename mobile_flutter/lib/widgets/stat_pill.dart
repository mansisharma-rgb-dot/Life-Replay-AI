import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class StatPill extends StatelessWidget {
  final String label;
  final String value;
  final IconData? icon;
  final String? emoji;
  final Color? color;
  final VoidCallback? onTap;

  const StatPill({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.emoji,
    this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final themeColor = color ?? AppColors.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: themeColor.withAlpha(28),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: themeColor.withAlpha(75), width: 1.2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (emoji != null) ...[
                Text(emoji!, style: const TextStyle(fontSize: 16)),
                const SizedBox(width: 8),
              ] else if (icon != null) ...[
                Icon(icon, size: 16, color: themeColor),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        label.toUpperCase(),
                        maxLines: 1,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMutedDark,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        value,
                        maxLines: 1,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimaryDark,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
