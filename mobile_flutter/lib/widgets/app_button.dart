import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

enum ButtonVariant { primary, secondary, outline, ghost }

class AppButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final ButtonVariant variant;
  final double? width;
  final double height;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.variant = ButtonVariant.primary,
    this.width,
    this.height = 54,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = widget.onPressed != null && !widget.isLoading;

    BoxDecoration decoration;
    Color textColor;

    switch (widget.variant) {
      case ButtonVariant.primary:
        decoration = BoxDecoration(
          gradient: isEnabled ? AppColors.primaryGradient : null,
          color: isEnabled ? null : AppColors.surfaceLightDark,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isEnabled
              ? [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(90),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        );
        textColor = Colors.white;
        break;
      case ButtonVariant.secondary:
        decoration = BoxDecoration(
          color: AppColors.secondary,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isEnabled
              ? [
                  BoxShadow(
                    color: AppColors.secondary.withAlpha(90),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        );
        textColor = Colors.white;
        break;
      case ButtonVariant.outline:
        decoration = BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primaryLight, width: 1.5),
        );
        textColor = AppColors.primaryLight;
        break;
      case ButtonVariant.ghost:
        decoration = BoxDecoration(
          color: AppColors.surfaceLightDark.withAlpha(120),
          borderRadius: BorderRadius.circular(16),
        );
        textColor = AppColors.textPrimaryDark;
        break;
    }

    return AnimatedScale(
      scale: _isPressed ? 0.96 : 1.0,
      duration: const Duration(milliseconds: 100),
      child: SizedBox(
        width: widget.width ?? double.infinity,
        height: widget.height,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: isEnabled ? widget.onPressed : null,
            onHighlightChanged: (val) {
              setState(() => _isPressed = val);
            },
            child: Ink(
              decoration: decoration,
              child: Center(
                child: widget.isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (widget.icon != null) ...[
                            Icon(widget.icon, color: textColor, size: 20),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                widget.text,
                                maxLines: 1,
                                style: TextStyle(
                                  color: textColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.3,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
