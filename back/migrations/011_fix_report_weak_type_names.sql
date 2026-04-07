-- 기존 achievement_reports의 content_json.weakTypes에 한국어 type_name 추가
DO $$
DECLARE
  r RECORD;
  weak_types JSONB;
  updated_types JSONB;
  item JSONB;
  type_name TEXT;
  i INTEGER;
BEGIN
  FOR r IN
    SELECT id, content_json
    FROM achievement_reports
    WHERE content_json->'weakTypes' IS NOT NULL
      AND jsonb_array_length(content_json->'weakTypes') > 0
  LOOP
    weak_types := r.content_json->'weakTypes';
    updated_types := '[]'::JSONB;

    FOR i IN 0..jsonb_array_length(weak_types) - 1 LOOP
      item := weak_types->i;

      SELECT qt.name INTO type_name
      FROM question_types qt
      WHERE qt.code = item->>'type_code';

      updated_types := updated_types || jsonb_build_array(
        jsonb_build_object(
          'type_code', item->>'type_code',
          'type_name', COALESCE(type_name, item->>'type_code')
        )
      );
    END LOOP;

    UPDATE achievement_reports
    SET content_json = jsonb_set(content_json, '{weakTypes}', updated_types)
    WHERE id = r.id;
  END LOOP;
END $$;
