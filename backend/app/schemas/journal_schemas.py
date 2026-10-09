from marshmallow import Schema, fields, validate, EXCLUDE

class JournalEntryUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(max=255), allow_none=True)
    content = fields.String(allow_none=True)

    class Meta:
        unknown = EXCLUDE
