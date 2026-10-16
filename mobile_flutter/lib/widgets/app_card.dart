import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Gradient? gradient;
  final double borderRadius;
  final bool hasGlow;
  final bool isGlass;
  final Color? borderColor;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.backgroundColor,
    this.gradient,
    this.borderRadius = 24.0,
    this.hasGlow = false,
    this.isGlass = false,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    Color cardColor;
    if (gradient != null) {
      cardColor = Colors.transparent;
    } else if (isGlass) {
      cardColor = AppColors.glassSurface;
    } else {
      cardColor = backgroundColor ?? AppColors.surfaceCardDark;
    }

    final effectiveBorderColor = borderColor ??
        (hasGlow
            ? AppColors.primaryLight.withAlpha(90)
            : isGlass
                ? AppColors.glassBorder
                : AppColors.borderDark);

    Widget content = Container(
      decoration: BoxDecoration(
        color: gradient == null ? cardColor : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: effectiveBorderColor,
          width: isGlass || hasGlow ? 1.4 : 1.1,
        ),
        boxShadow: [
          BoxShadow(
            color: hasGlow
                ? AppColors.primary.withAlpha(50)
                : Colors.black.withAlpha(35),
            blurRadius: hasGlow ? 22 : 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: padding ?? const EdgeInsets.all(20),
        child: child,
      ),
    );

    if (isGlass) {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: content,
        ),
      );
    } else {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: content,
      );
    }

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(borderRadius),
          onTap: onTap,
          splashColor: AppColors.primaryLight.withAlpha(40),
          highlightColor: AppColors.primaryLight.withAlpha(20),
          child: content,
        ),
      );
    }

    return content;
  }
}
