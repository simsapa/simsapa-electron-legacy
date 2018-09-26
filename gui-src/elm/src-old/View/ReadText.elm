module View.ReadText exposing (view, viewRootText, viewTranslatedText)

import Html exposing (..)
import Markdown
import Material.LayoutGrid as Grid
import Material.Options as Options exposing (cs, css, onClick, onInput, styled, when)
import Model exposing (Model)
import Msg exposing (Msg(..))
import Pali exposing (..)
import Regex
import Types exposing (..)
import View.LookupWord


view : Model -> Html Msg
view model =
    Grid.view []
        [ Grid.cell
            [ Grid.span12
            , css "padding" "1em"
            , css "overflow" "scroll"
            , css "max-height" "800px"
            ]
            [ contentView model ]
        , Grid.cell
            [ Grid.span12
            , css "padding" "1em"
            , css "overflow" "scroll"
            , css "max-height" "800px"
            , css "border-top" "1px #ccc solid"
            ]
            [ View.LookupWord.view model ]
        ]


contentView : Model -> Html Msg
contentView model =
    case model.textReadState.selectedText of
        Just t ->
            case t of
                SelectedRootText t_ ->
                    viewRootText t_

                SelectedTranslatedText t_ ->
                    viewTranslatedText t_

        Nothing ->
            div [] [ text "No selected text." ]


viewRootText : RootText -> Html Msg
viewRootText root_text =
    Html.div
        []
        [ textToSpans root_text.content_plain ]


viewTranslatedText : TranslatedText -> Html Msg
viewTranslatedText translated_text =
    Html.div [] <|
        Markdown.toHtml mdRawHtml translated_text.content_html


textToSpans : String -> Html Msg
textToSpans content =
    let
        lineToSpans line =
            List.map
                (\word ->
                    styled Html.span
                        [ cs "hover-gray"
                        , css "padding-right" "0.4em"
                        , onClick (FetchLookupWord (stemWord (sanitizeWord word)))
                        ]
                        [ text word ]
                )
                (List.filter (\x -> String.length (String.trim x) > 0)
                    (String.split "SPLITME"
                        (Regex.replace
                            (Maybe.withDefault Regex.never <| Regex.fromString "[ \\.\\?\\!:'\"“”‘’]")
                            (\{ match } -> "SPLITME" ++ match ++ "SPLITME")
                            line
                        )
                    )
                )

        spans =
            List.map (\line -> Html.p [] (lineToSpans line)) (String.lines content)
    in
    div [] spans
